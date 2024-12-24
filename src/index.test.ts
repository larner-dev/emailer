import { describe, test, expect } from "vitest";
import { EmailerHandlebars } from ".";

describe("index", () => {
  test("true should be true", () => {
    const test = EmailerHandlebars.compile(`{{#if foo}}foo{{/if}}`);
    expect(test({ foo: true })).toEqual("foo");
    expect(test({ foo: false })).toEqual("");
  });
});
