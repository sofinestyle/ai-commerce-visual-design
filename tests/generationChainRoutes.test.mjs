import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { jsonResponse, loadRouteModule, readJson } from "./helpers/routeTestUtils.mjs";

let authResponse = null;
let serviceFilters = null;
let serviceResult = [];
let serviceShouldThrow = false;

const routeStubs = {
  "@/lib/apiResponse": {
    apiError: (error, statusCode = 500) =>
      jsonResponse({ success: false, error: String(error) }, { status: statusCode }),
    apiSuccess: (data) => jsonResponse({ success: true, data }),
  },
  "@/lib/auth/requestAuth": {
    requireUserApiResponse: async () => authResponse,
  },
  "@/lib/services/generationChainService": {
    generationChainService: {
      getAll: async (filters) => {
        if (serviceShouldThrow) {
          throw new Error("chain read failed");
        }

        serviceFilters = filters;

        return serviceResult;
      },
    },
  },
};

function loadGenerationChainsRoute() {
  return loadRouteModule("src/app/api/generation-chains/route.ts", routeStubs);
}

beforeEach(() => {
  authResponse = null;
  serviceFilters = null;
  serviceResult = [
    {
      generationGroupId: "group-1",
      images: [],
      rootImages: [],
    },
  ];
  serviceShouldThrow = false;
});

test("generation-chains GET forwards trimmed query filters", async () => {
  const { GET } = loadGenerationChainsRoute();
  const response = await GET(
    new Request(
      "http://localhost/api/generation-chains?generationGroupId=%20group-1%20&projectId=%20project-1%20&sku=%20SKU-1%20",
    ),
  );
  const body = await readJson(response);

  assert.equal(response.status, 200);
  assert.deepEqual(serviceFilters, {
    generationGroupId: "group-1",
    projectId: "project-1",
    sku: "SKU-1",
  });
  assert.deepEqual(body, { success: true, data: serviceResult });
});

test("generation-chains GET returns auth response before service calls", async () => {
  authResponse = jsonResponse({ success: false, error: "请先登录。" }, { status: 401 });
  const { GET } = loadGenerationChainsRoute();
  const response = await GET(new Request("http://localhost/api/generation-chains"));
  const body = await readJson(response);

  assert.equal(response.status, 401);
  assert.deepEqual(body, { success: false, error: "请先登录。" });
  assert.equal(serviceFilters, null);
});

test("generation-chains GET returns service errors", async () => {
  serviceShouldThrow = true;
  const { GET } = loadGenerationChainsRoute();
  const response = await GET(new Request("http://localhost/api/generation-chains"));
  const body = await readJson(response);

  assert.equal(response.status, 500);
  assert.equal(body.error, "chain read failed");
});
