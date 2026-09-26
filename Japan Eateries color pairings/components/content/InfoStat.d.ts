export interface InfoStatProps {
  /** Small uppercase label, e.g. "Restaurant" */
  label: string;
  value: string;
  align?: 'left' | 'center';
}
export declare function InfoStat(props: InfoStatProps): JSX.Element;
