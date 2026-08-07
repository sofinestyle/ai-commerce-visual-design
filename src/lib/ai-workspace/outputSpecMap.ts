import type { ImageType, OutputSpecification, Platform } from "@/lib/ai-workspace/types";

export type OutputSpecDefaults = Pick<OutputSpecification, "aspectRatio" | "outputSize">;

const squareSpec: OutputSpecDefaults = {
  aspectRatio: "1:1",
  outputSize: "1024x1024",
};

const defaultSpecMap: Record<Platform, Record<ImageType, OutputSpecDefaults>> = {
  Amazon: {
    主图: squareSpec,
    详情页: {
      aspectRatio: "竖版",
      outputSize: "750x1200",
    },
  },
  TEMU: {
    主图: squareSpec,
    详情页: {
      aspectRatio: "竖版",
      outputSize: "750x1200",
    },
  },
  SHEIN: {
    主图: squareSpec,
    详情页: {
      aspectRatio: "竖版",
      outputSize: "750x1200",
    },
  },
  天猫: {
    主图: squareSpec,
    详情页: {
      aspectRatio: "竖版",
      outputSize: "750x1200",
    },
  },
  抖店: {
    主图: squareSpec,
    详情页: {
      aspectRatio: "竖版",
      outputSize: "750x1200",
    },
  },
  独立站: {
    主图: squareSpec,
    详情页: {
      aspectRatio: "竖版",
      outputSize: "750x1200",
    },
  },
};

export function getRecommendedOutputSpec(
  platform: Platform,
  imageType: ImageType,
): OutputSpecDefaults {
  return defaultSpecMap[platform]?.[imageType] ?? squareSpec;
}
