import { ModelResultConfig } from "./fetchers/fetchers";

export type PromptRecord = ModelResultConfig;

export type ModelFetcher = () => Promise<PromptRecord>;
