import { MissionClient } from "./MissionClient";

export default function MissionPage({ params }: { params: { id: string } }) {
  return <MissionClient missionId={params.id} />;
}
