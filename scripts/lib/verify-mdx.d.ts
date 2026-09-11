export interface MdxFailure {
  file: string;
  error: Error;
}

export function verifyMdxDir(dir: string): Promise<MdxFailure[]>;
export function reportMdxFailures(failures: MdxFailure[], rootDir: string): boolean;
