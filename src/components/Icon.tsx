import type { CSSProperties } from 'react';
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowsInLineHorizontalIcon,
  AtIcon,
  BellIcon,
  BookmarkSimpleIcon,
  BriefcaseIcon,
  CakeIcon,
  CalendarBlankIcon,
  CameraIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChartBarHorizontalIcon,
  ChatCircleDotsIcon,
  ChatCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  CirclesThreePlusIcon,
  ClipboardTextIcon,
  ClockCounterClockwiseIcon,
  CompassIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  GearSixIcon,
  GlobeHemisphereWestIcon,
  GoogleLogoIcon,
  GraduationCapIcon,
  HeartIcon,
  HouseIcon,
  HouseLineIcon,
  ImageSquareIcon,
  ImagesIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  NotePencilIcon,
  PaperPlaneRightIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  PhoneIcon,
  PlusIcon,
  ProhibitIcon,
  RowsIcon,
  ShareFatIcon,
  ShareNetworkIcon,
  SignOutIcon,
  SparkleIcon,
  StarIcon,
  SunIcon,
  TextAlignLeftIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
  UsersThreeIcon,
  VideoCameraIcon,
  WarningCircleIcon,
  XIcon,
  SlidersHorizontalIcon,
  ArrowUUpLeftIcon,
  ListIcon,
  LockKeyIcon,
  FlagIcon,
  EnvelopeSimpleIcon,
  AndroidLogoIcon,
  AppleLogoIcon,
  GlobeIcon,
  ShieldCheckIcon,
  type Icon as PhosphorIcon,
  type IconWeight,
} from '@phosphor-icons/react';

/**
 * Phosphor icons by the design's kebab-case names (`ph ph-heart` ->
 * `heart`). The same names the mobile app's Icon.tsx uses, so data files
 * (About rows, notification kinds) port unchanged.
 */
const ICONS = {
  'arrow-clockwise': ArrowClockwiseIcon,
  'arrow-counter-clockwise': ArrowCounterClockwiseIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-up': ArrowUpIcon,
  'arrows-in-line-horizontal': ArrowsInLineHorizontalIcon,
  at: AtIcon,
  bell: BellIcon,
  'bookmark-simple': BookmarkSimpleIcon,
  briefcase: BriefcaseIcon,
  cake: CakeIcon,
  'calendar-blank': CalendarBlankIcon,
  camera: CameraIcon,
  'caret-down': CaretDownIcon,
  'caret-left': CaretLeftIcon,
  'caret-right': CaretRightIcon,
  'chart-bar-horizontal': ChartBarHorizontalIcon,
  'chat-circle': ChatCircleIcon,
  'chat-circle-dots': ChatCircleDotsIcon,
  check: CheckIcon,
  'check-circle': CheckCircleIcon,
  'circles-three-plus': CirclesThreePlusIcon,
  'clipboard-text': ClipboardTextIcon,
  'clock-counter-clockwise': ClockCounterClockwiseIcon,
  compass: CompassIcon,
  'dots-three': DotsThreeIcon,
  'download-simple': DownloadSimpleIcon,
  eye: EyeIcon,
  'eye-slash': EyeSlashIcon,
  'gear-six': GearSixIcon,
  'globe-hemisphere-west': GlobeHemisphereWestIcon,
  'google-logo': GoogleLogoIcon,
  'graduation-cap': GraduationCapIcon,
  heart: HeartIcon,
  house: HouseIcon,
  'house-line': HouseLineIcon,
  'image-square': ImageSquareIcon,
  images: ImagesIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  'map-pin': MapPinIcon,
  'note-pencil': NotePencilIcon,
  'paper-plane-right': PaperPlaneRightIcon,
  'paper-plane-tilt': PaperPlaneTiltIcon,
  'pencil-simple': PencilSimpleIcon,
  phone: PhoneIcon,
  plus: PlusIcon,
  prohibit: ProhibitIcon,
  rows: RowsIcon,
  'share-fat': ShareFatIcon,
  'share-network': ShareNetworkIcon,
  'sign-out': SignOutIcon,
  sparkle: SparkleIcon,
  star: StarIcon,
  sun: SunIcon,
  'text-align-left': TextAlignLeftIcon,
  trash: TrashIcon,
  'user-plus': UserPlusIcon,
  users: UsersIcon,
  'users-three': UsersThreeIcon,
  'video-camera': VideoCameraIcon,
  'warning-circle': WarningCircleIcon,
  x: XIcon,
  sliders: SlidersHorizontalIcon,
  undo: ArrowUUpLeftIcon,
  list: ListIcon,
  'lock-key': LockKeyIcon,
  flag: FlagIcon,
  envelope: EnvelopeSimpleIcon,
  android: AndroidLogoIcon,
  apple: AppleLogoIcon,
  globe: GlobeIcon,
  'shield-check': ShieldCheckIcon,
} satisfies Record<string, PhosphorIcon>;

export type PhosphorName = keyof typeof ICONS;

export type IconProps = {
  name: PhosphorName;
  size?: number;
  weight?: IconWeight;
  color?: string;
  className?: string;
  style?: CSSProperties;
  /** Icons are decorative by default; give a label only when it stands alone. */
  label?: string;
};

export function Icon({
  name,
  size = 20,
  weight = 'regular',
  color = 'currentColor',
  className,
  style,
  label,
}: IconProps) {
  const Cmp = ICONS[name];
  return (
    <Cmp
      size={size}
      weight={weight}
      color={color}
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  );
}
