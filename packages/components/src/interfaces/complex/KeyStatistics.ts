export interface KeyStatisticsProps {
  type: "keystatistics";
  variant: "side" | "top";
  title: string;
  statistics: {
    label: string;
    value: string;
  }[];
}
