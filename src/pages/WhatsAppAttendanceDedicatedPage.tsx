import { useParams } from "react-router-dom";
import AuthCheck from "@/components/auth/AuthCheck";
import WhatsAppAttendanceDedicated from "@/components/whatsapp/WhatsAppAttendanceDedicated";

const WhatsAppAttendanceDedicatedPage = () => {
  const { slug } = useParams();

  return (
    <AuthCheck 
      requiresAuth={true} 
      redirectPath={`/app/${slug}/login`}
    >
      <WhatsAppAttendanceDedicated />
    </AuthCheck>
  );
};

export default WhatsAppAttendanceDedicatedPage;