


export type TToolIOType = {
  type: string;
  required?: boolean;
  desc?: string;
};

export type TToolInputOutput = Record<string, TToolIOType>;

export type TTool = {
  name: string;
  type: string;
  desc: string;
  tags: string;
  shortDesc?: string;
  longDesc?: string;
  when?: string;
  input?: string | TToolInputOutput;
  output?: string | TToolInputOutput;
};

export type TToolGroup = {
  group: string;
  tools: TTool[];
};
