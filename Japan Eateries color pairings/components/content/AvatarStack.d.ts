export interface AvatarStackPerson { initials?: string; src?: string; }
export interface AvatarStackProps {
  people: AvatarStackPerson[];
  /** Avatars shown before the +N chip. Default 3 */
  max?: number;
  /** Text after the stack, e.g. "Visited" */
  caption?: string;
}
export declare function AvatarStack(props: AvatarStackProps): JSX.Element;
