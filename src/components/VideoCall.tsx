import { useEffect, useRef } from "react";

interface VideoCallProps {
  roomName: string;
  displayName: string;
  onEnd: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoCall = ({ roomName, displayName, onEnd }: VideoCallProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const jitsiRef = useRef<any>(null);

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initializeJitsi();
      } else {
        script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = initializeJitsi;
        document.body.appendChild(script);
      }
    };

    const initializeJitsi = () => {
      if (!containerRef.current) return;

      const domain = "meet.jit.si";

      const options = {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
        },
      };

      jitsiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      // When call ends
      jitsiRef.current.addEventListener("readyToClose", () => {
        onEnd();
      });
    };

    loadJitsi();

    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }

      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [roomName, displayName, onEnd]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
        <h2 className="font-semibold">Consultation In Progress</h2>
        <button
          onClick={onEnd}
          className="bg-red-600 px-4 py-2 rounded-lg"
        >
          End Call
        </button>
      </div>

      {/* Video Container */}
      <div ref={containerRef} className="flex-1" />
    </div>
  );
};

export default VideoCall;