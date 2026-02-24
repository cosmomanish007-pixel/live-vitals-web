import { useEffect, useRef } from "react";

interface Props {
  roomName: string;
  displayName: string;
  onEnd: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoCall = ({ roomName, displayName, onEnd }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    const loadScript = () => {
      if (window.JitsiMeetExternalAPI) {
        startJitsi();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = startJitsi;
      document.body.appendChild(script);
    };

    const startJitsi = () => {
      const domain = "meet.jit.si";

      const options = {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: 600,
        userInfo: {
          displayName,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addEventListener("readyToClose", () => {
        onEnd();
      });
    };

    loadScript();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [roomName, displayName, onEnd]);

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg">
      <div ref={containerRef} />
    </div>
  );
};

export default VideoCall;
