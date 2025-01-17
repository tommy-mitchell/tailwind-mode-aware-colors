const withModeAwareColors = require("../src/index");
const postcss = require("postcss");

describe("textColor theme", () => {
  const theme = {
    textColor: {
      a: {
        light: "#ffffff",
        dark: "#000000",
      },
    },
  };
  const config = withModeAwareColors({ theme });

  it("Flattens color map and adds mode aware color", () => {
    expect(config).toEqual(
      expect.objectContaining({
        theme: {
          textColor: {
            a: expect.any(Function),
            "a-light": "#ffffff",
            "a-dark": "#000000",
          },
        },
      })
    );
  });

  it("Defines mode aware color as a function based on opacity", () => {
    const a = config.theme.textColor.a;
    expect(a({})).toEqual(
      "rgb(var(--color-text-a) / var(--opacity-text-a, 1))"
    );
    expect(a({ opacityValue: 0.4 })).toEqual("rgb(var(--color-text-a) / 0.4)");
    expect(a({ opacityValue: "var(--tw-text-opacity)" })).toEqual(
      "rgb(var(--color-text-a) / var(--opacity-text-a, var(--tw-text-opacity)))"
    );
  });

  describe("extend", () => {
    const theme = {
      extend: {
        textColor: {
          a: {
            light: "#ffffff",
            dark: "#000000",
          },
        },
      },
    };
    const config = withModeAwareColors({ theme });

    it("Flattens extend color map and adds mode aware color", () => {
      expect(config).toEqual(
        expect.objectContaining({
          theme: {
            extend: {
              textColor: {
                a: expect.any(Function),
                "a-light": "#ffffff",
                "a-dark": "#000000",
              },
            },
          },
        })
      );
    });

    it("Defines mode aware color as a function based on opacity", () => {
      const a = config.theme.extend.textColor.a;
      expect(a({})).toEqual(
        "rgb(var(--color-text-a) / var(--opacity-text-a, 1))"
      );
      expect(a({ opacityValue: 0.4 })).toEqual(
        "rgb(var(--color-text-a) / 0.4)"
      );
      expect(a({ opacityValue: "var(--tw-text-opacity)" })).toEqual(
        "rgb(var(--color-text-a) / var(--opacity-text-a, var(--tw-text-opacity)))"
      );
    });
  });

  describe.each`
    darkModeConfig                   | expectedSelector
    ${undefined}                     | ${"@media (prefers-color-scheme: dark) { :root"}
    ${"media"}                       | ${"@media (prefers-color-scheme: dark) { :root"}
    ${["media", ".something"]}       | ${"@media (prefers-color-scheme: dark) { :root"}
    ${"class"}                       | ${".dark"}
    ${["class"]}                     | ${".dark"}
    ${["class", ".custom-selector"]} | ${".custom-selector"}
  `(
    "When darkMode config is $darkModeConfig",
    ({ darkModeConfig, expectedSelector }) => {
      it("Generates the correct CSS", () => {
        const config = withModeAwareColors({
          darkMode: darkModeConfig,
          content: [
            {
              raw: "bg-a text-a/50 dark something custom-selector",
            },
          ],
          theme: {
            textColor: {
              a: {
                light: "#ffffff",
                dark: "#000000",
              },
            },
          },
        });

        let utilitiesCSS = postcss([require("tailwindcss")(config)]).process(
          "@tailwind utilities"
        ).css;

        expect(utilitiesCSS.replace(/\n|\s|\t/g, "")).toBe(
          `
          .text-a\\/50 {
            color: rgb(var(--color-text-a) / 0.5)
          }
          `.replace(/\n|\s|\t/g, "")
        );

        let baseCSS = postcss([require("tailwindcss")(config)]).process(
          "@tailwind base"
        ).css;

        expect(baseCSS.replace(/\n|\s|\t/g, "")).toContain(
          `:root {
          --color-text-a: 255 255 255;
        }`.replace(/\n|\s|\t/g, "")
        );
        expect(baseCSS.replace(/\n|\s|\t/g, "")).toContain(
          `${expectedSelector} {
          --color-text-a: 0 0 0;
        }`.replace(/\n|\s|\t/g, "")
        );
      });
    }
  );
});
