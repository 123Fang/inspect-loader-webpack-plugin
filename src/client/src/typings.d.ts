declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.png';

type TransformMap = Record<string, TransformInfo[]>;

interface TransformInfo {
  name: string;
  result: string;
  beforeResult: string;
  start: number;
  end: number;
  oldCode: string;
  newCode: string
}
