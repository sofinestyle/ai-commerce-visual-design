export type ImageAnalysisResult = {
  productType: string;
  material: string;
  color: string;
  background: string;
  platform: string;
  suggestedPrompt: string;
};

export const imageAnalysisService = {
  async analyze(mediaId: string): Promise<ImageAnalysisResult> {
    void mediaId;

    return {
      productType: "violin",
      material: "wood",
      color: "brown",
      background: "white",
      platform: "amazon",
      suggestedPrompt:
        "Professional Amazon product hero image featuring a polished wooden violin on a clean white background with premium studio lighting.",
    };
  },
};
