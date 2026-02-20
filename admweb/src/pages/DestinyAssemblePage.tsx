// 명리어셈블 진입 페이지: /destiny_assemble/saju_assemble로 리다이렉트.
import { Navigate } from 'react-router-dom';

export default function DestinyAssemblePage() {
  return <Navigate to="/destiny_assemble/saju_assemble" replace />;
}
