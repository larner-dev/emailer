import chalk from "chalk";
import { readdir, readFile, realpath } from "fs/promises";
import { dirname, isAbsolute, relative, resolve } from "path";
import { cwd } from "process";
import nodemailer from "nodemailer";
import { log } from "./lib/log";
import mjml from "mjml";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import Mail from "nodemailer/lib/mailer";
import Handlebars from "handlebars";

const getFiles = async (dir: string): Promise<string[]> => {
  const realDir = await realpath(dir);
  const dirents = await readdir(realDir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(realDir, dirent.name);
      return dirent.isDirectory() || dirent.isSymbolicLink()
        ? getFiles(res)
        : res;
    }),
  );
  return Array.prototype.concat(...files);
};

type Template = {
  id: string;
  subject: HandlebarsTemplateDelegate;
  sender: HandlebarsTemplateDelegate;
  replyTo?: HandlebarsTemplateDelegate;
  text: HandlebarsTemplateDelegate;
  html: HandlebarsTemplateDelegate;
  src: string;
};

export class Emailer {
  transporter: nodemailer.Transporter | null;
  private templates: Map<string, Template> = new Map();
  constructor() {
    this.transporter = null;
  }
  init(transportConfig: string | SMTPTransport.Options) {
    this.transporter = nodemailer.createTransport(transportConfig);
  }
  async loadTemplate(src: string): Promise<boolean> {
    const template: Partial<Template> = { src };
    const content = (await readFile(src)).toString();
    const regex = /<!--\s*?([a-zA-Z]+)\s*?:(.*?)\s*?-->/gms;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      if (
        match[1] === "subject" ||
        match[1] === "sender" ||
        match[1] === "replyTo" ||
        match[1] === "text"
      ) {
        template[match[1]] = Handlebars.compile(match[2].trim());
      } else if (match[1] === "id") {
        template[match[1]] = match[2].trim();
      }
    }

    let hasError = false;
    if (!template.id) {
      log(chalk.red(`No id specified for ${src}`));
      hasError = true;
    }
    if (!template.sender) {
      log(chalk.red(`No sender specified for ${src}`));
      hasError = true;
    }
    if (!template.subject) {
      log(chalk.red(`No subject specified for ${src}`));
      hasError = true;
    }
    if (!template.text) {
      log(chalk.yellow(`No text specified for ${src}`));
    }
    const parsedMjml = mjml(content, {
      keepComments: false,
      filePath: src,
    });
    for (const error of parsedMjml.errors) {
      log(
        chalk.red(
          `Error in ${relative(dirname(src), src)}: ` + error.formattedMessage,
        ),
      );
      hasError = true;
    }
    template.html = Handlebars.compile(parsedMjml.html);
    if (template.id && this.templates.has(template.id)) {
      log(
        chalk.red(
          `Two templates share the same id "${template.id}" ${src} ${
            this.templates.get(template.id)?.src
          }`,
        ),
      );
      hasError = true;
    }
    if (!hasError && template.id) {
      this.templates.set(template.id, template as Template);
    }
    return hasError;
  }
  async load(src: string): Promise<boolean> {
    if (!isAbsolute(src)) {
      src = resolve(cwd(), src);
    }

    let files: string[] = [];
    try {
      files = await getFiles(src);
    } catch (error) {
      if ((error as Record<string, unknown>).code === "ENOENT") {
        log(chalk.red(`Source directory doesn't exist: ${src}`));
        return false;
      }
    }

    files = files.filter((f) => f.endsWith(".mjml"));

    const hasFailure = (
      await Promise.all(files.map((f) => this.loadTemplate(f)))
    ).some((success) => !success);

    return !hasFailure;
  }
  async send(
    id: string,
    options: Mail.Options,
    data: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error("Transporter not initialized");
    }
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Invalid emailer template id ${id}`);
    }

    const updatedOptions = {
      from: template.sender(data),
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
      replyTo: template.replyTo ? template.replyTo(data) : undefined,
      ...options,
    };

    return this.transporter.sendMail(updatedOptions);
  }
}
