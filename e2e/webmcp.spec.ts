import { expect, test, type Page } from "@playwright/test";

type ToolResponse = {
  success: boolean;
  stateVersion: number;
  error?: string;
  data?: Record<string, unknown>;
};

type TestTool = {
  name: string;
  execute: (
    input: unknown,
    options?: { signal?: AbortSignal },
  ) => Promise<ToolResponse> | ToolResponse;
};

declare global {
  interface Window {
    webMcpTestHarness: {
      execute: (name: string, input: unknown) => Promise<ToolResponse>;
      names: () => string[];
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const tools = new Map<string, TestTool>();
    const previousLoads =
      Number(window.name.replace("changedecision-loads:", "")) || 0;
    window.name = `changedecision-loads:${previousLoads + 1}`;

    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: async (
          tool: TestTool,
          options?: { signal?: AbortSignal },
        ) => {
          tools.set(tool.name, tool);
          options?.signal?.addEventListener(
            "abort",
            () => {
              if (tools.get(tool.name) === tool) {
                tools.delete(tool.name);
              }
            },
            { once: true },
          );
        },
      },
    });

    window.webMcpTestHarness = {
      execute: async (name, input) => {
        const tool = tools.get(name);

        if (!tool) {
          throw new Error(`Tool ${name} is not registered.`);
        }

        return tool.execute(input, { signal: new AbortController().signal });
      },
      names: () => [...tools.keys()],
    };
  });
});

test("completes the WebMCP hero journey without document reloads", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "ChangeFrame" }),
  ).toBeVisible();
  await expectToolNames(page, [
    "get_decision_context",
    "get_user_constraints",
    "evaluate_resolution_options",
  ]);
  await expect(
    page.getByRole("heading", { name: "Agent Flight Recorder" }),
  ).toBeVisible();
  await expect(
    page.getByText("3 of 7 tools live", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Human authority: protected")).toBeVisible();

  let response = await executeTool(page, "evaluate_resolution_options", {
    expectedStateVersion: 1,
  });
  expect(response.success).toBe(true);
  await expect(
    page.getByText("Options available", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open Agent Flight Recorder" })
    .click();
  const flightTrace = page.getByRole("region", { name: "Latest trace" });
  await expect(
    flightTrace.getByText("evaluate_resolution_options", { exact: true }),
  ).toBeVisible();
  await expect(flightTrace.getByText("v1 → v2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close flight recorder" }).click();
  await expectToolNames(page, ["get_decision_context", "get_user_constraints"]);

  await page.getByRole("button", { name: "Create field constraint" }).click();
  await page
    .getByRole("button", { name: "Open Agent Flight Recorder" })
    .click();
  await expect(
    flightTrace.getByText("upsert_constraint", { exact: true }),
  ).toBeVisible();
  await expect(flightTrace.getByText("human", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close flight recorder" }).click();
  await expectToolNames(page, [
    "get_decision_context",
    "get_user_constraints",
    "revise_resolution_option",
  ]);

  response = await executeTool(page, "revise_resolution_option", {
    optionId: "OPTION-A",
    constraintIds: ["CONSTRAINT-12"],
    expectedOptionRevision: 1,
    expectedStateVersion: 3,
  });
  expect(response.success).toBe(true);
  await expect(
    page.getByRole("cell", { name: "Avoids CONSTRAINT-12" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Select", exact: true })
    .first()
    .click();
  await expectToolNames(page, [
    "get_decision_context",
    "get_user_constraints",
    "simulate_project_impact",
  ]);

  response = await executeTool(page, "simulate_project_impact", {
    preserveInspectionMilestone: true,
    expectedStateVersion: 5,
  });
  expect(response.success).toBe(true);
  expect(response.data?.totalCostImpact).toBe(6500);
  await expect(
    page.getByRole("heading", { name: "Change Ripple X-Ray" }),
  ).toBeVisible();
  await expect(page.getByText("MEP-342 shifts")).toBeVisible();
  await expect(page.getByText("+$6,500 net change")).toBeVisible();
  await page.getByRole("button", { name: "Replay ripple" }).click();
  await expectToolNames(page, [
    "get_decision_context",
    "get_user_constraints",
    "prepare_change_decision",
  ]);

  response = await executeTool(page, "prepare_change_decision", {
    expectedStateVersion: 6,
  });
  expect(response.success).toBe(true);
  await expect(
    page.getByText("Ready for approval", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Decision Receipt" }),
  ).toBeVisible();
  await expect(
    page.getByText("Awaiting human approval", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("DEC-019 / OPTION-A.r2 / CONSTRAINT-12 / v6", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Flight provenance/i }),
  ).toHaveAttribute("href", "#agent-flight-recorder");
  await expectToolNames(page, ["get_decision_context", "get_user_constraints"]);

  await page.getByRole("button", { name: "Approve decision" }).click();
  await page
    .getByRole("button", { name: "Open Agent Flight Recorder" })
    .click();
  await expect(
    flightTrace.getByText("approve_decision", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Replay trace" }).click();
  await expect(page.getByText("v8", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close flight recorder" }).click();
  await expectToolNames(page, [
    "get_decision_context",
    "get_user_constraints",
    "draft_change_order",
  ]);

  response = await executeTool(page, "draft_change_order", {
    expectedStateVersion: 8,
  });
  expect(response.success).toBe(true);
  await expect(page.getByText("CO-007").first()).toBeVisible();
  await expect(
    page.getByText("Change order drafted", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Human approved", { exact: true })).toBeVisible();
  await expect(
    page.getByText("CO-007 is a draft only; no contract was executed.", {
      exact: true,
    }),
  ).toBeVisible();
  await expectToolNames(page, ["get_decision_context", "get_user_constraints"]);

  expect(await page.evaluate(() => window.name)).toBe("changedecision-loads:1");
});

test("returns explicit conflicts and unsupported geometry without hidden mutation", async ({
  page,
}) => {
  await page.goto("/");
  await executeTool(page, "evaluate_resolution_options", {
    expectedStateVersion: 1,
  });

  const stale = await executeTool(page, "get_decision_context", {});
  expect(stale.stateVersion).toBe(2);

  await page.getByRole("spinbutton", { name: "X" }).fill("440");
  await page.getByRole("spinbutton", { name: "Y" }).fill("360");
  await page.getByRole("spinbutton", { name: "W" }).fill("280");
  await page.getByRole("spinbutton", { name: "H" }).fill("60");
  await page.getByRole("button", { name: "Create field constraint" }).click();
  await expectToolNames(page, [
    "get_decision_context",
    "get_user_constraints",
    "revise_resolution_option",
  ]);

  const unsupported = await executeTool(page, "revise_resolution_option", {
    optionId: "OPTION-A",
    constraintIds: ["CONSTRAINT-12"],
    expectedOptionRevision: 1,
    expectedStateVersion: 3,
  });
  expect(unsupported.success).toBe(false);
  expect(unsupported.error).toBe("UNSUPPORTED_CONSTRAINT_GEOMETRY");
  expect(unsupported.stateVersion).toBe(3);

  const replay = await executeTool(page, "revise_resolution_option", {
    optionId: "OPTION-A",
    constraintIds: ["CONSTRAINT-12"],
    expectedOptionRevision: 1,
    expectedStateVersion: 2,
  });
  expect(replay.success).toBe(false);
  expect(replay.error).toBe("STATE_CONFLICT");
  expect(replay.stateVersion).toBe(3);
});

test("restores a valid session, resets monotonically, and rejects corrupted persistence", async ({
  page,
}) => {
  await page.goto("/");
  await executeTool(page, "evaluate_resolution_options", {
    expectedStateVersion: 1,
  });
  await page.reload();

  await expect(
    page.getByText("Options available", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("v2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset workflow" }).click();
  await expect(page.getByText("Investigating", { exact: true })).toBeVisible();
  await expect(page.getByText("v3", { exact: true })).toBeVisible();

  await page.evaluate(() => {
    window.sessionStorage.setItem(
      "changedecision-os:decision-room:v2",
      "{corrupted",
    );
  });
  await page.reload();

  await expect(page.getByText("Investigating", { exact: true })).toBeVisible();
  await expect(page.getByText("v1", { exact: true })).toBeVisible();
  await expectToolNames(page, [
    "get_decision_context",
    "get_user_constraints",
    "evaluate_resolution_options",
  ]);
});

async function executeTool(
  page: Page,
  name: string,
  input: unknown,
): Promise<ToolResponse> {
  return page.evaluate(
    async ({ toolName, toolInput }) =>
      window.webMcpTestHarness.execute(toolName, toolInput),
    { toolName: name, toolInput: input },
  );
}

async function expectToolNames(
  page: Page,
  expectedNames: string[],
): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => window.webMcpTestHarness.names()))
    .toEqual(expectedNames);
}
