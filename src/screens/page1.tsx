import { useCallback, useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import * as faceapi from 'face-api.js';

import { DrawerDemo } from './addFace';

const Page1 = () => {

  let [faces,_setFaces] = useState(JSON.parse(localStorage.getItem('CurrentData')||"")) 
  let [Fersons,_setFersons] = useState(JSON.parse(localStorage.getItem('CurrentFersons')||"")) 



  
  const [status, setStatus] = useState("Loading...");
  const MODEL_URL = "/face-rec/models";
  const videoRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const [camera, setCamera] = useState('environment');
  const [name, setName] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);

  const loadModels = useCallback(async () => {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    faceMyDetect();
  }, []);

  const startVideo = useCallback(async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track:any) => track.stop());
      videoRef.current.srcObject = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: camera } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        loadModels();
      }
    } catch (err) {
      console.error(err);
    }
  }, [camera, loadModels]);

  useEffect(() => {
    startVideo();
  }, [camera, startVideo]);

  // function Refresh(){

  //   setFaces(JSON.parse(localStorage.getItem('CurrentData')||""))
  //   setFersons(JSON.parse(localStorage.getItem('CurrentFersons')||""))
  //   startVideo();

  // }

  const getLabeledFaceDescriptions = useCallback(async () => {
    return Promise.all(
      faces.map(async (label:any) => {
        const descriptions = label.descriptors.map((arr:any) => new Float32Array(arr));
        return new faceapi.LabeledFaceDescriptors(label.label, descriptions);
      })
    );
  }, []);

  const faceMyDetect = useCallback(async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    const detectFaces = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const dims = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      faceapi.matchDimensions(canvasRef.current, dims);

      const resizedDetections = faceapi.resizeResults(detections, dims);
      const context = canvasRef.current.getContext("2d");
      context.clearRect(0, 0, dims.width, dims.height);

      const results:any = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
      faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
      results.forEach((result:any, i:any) => {
        const box = resizedDetections[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
        drawBox.draw(canvasRef.current);
      });

      setName(results);
      setStatus("Running");

      requestAnimationFrame(detectFaces);
    };

    detectFaces();
  }, [getLabeledFaceDescriptions]);

  return (
    <div className="min-h-full w-full max-w-[1468px] flex flex-col justify-center">
      <div className="border border-border flex flex-col gap-5 items-center justify-center h-screen w-full">
        <div className="text-foreground text-sm w-[300px] flex items-center gap-6 justify-center">
          <p className="font-semibold text-lg">Face Rex v.1.1</p>
          <DrawerDemo  />
        </div>
        
        <div className="overflow-hidden w-full max-w-[500px] h-[500px] relative flex">
          <div className="ml-2 mt-5 absolute gap-2 text-primary col-span-1 flex flex-col">
            {name && name.map((response:any, key) => {
              const matchedData = Fersons.find((item:any) => item.id === response._label);
              return matchedData ? (
                <div key={key} className="text-sm bg-card/50 backdrop-blur-md p-2 rounded-md">
                  <h3>{matchedData.name}</h3>
                  <p>{matchedData.position}</p>
                </div>
              ) : null;
            })}
          </div>
          <video crossOrigin="anonymous" ref={videoRef} className="w-full h-full border-border border-2 rounded-md" autoPlay></video>
          <canvas ref={canvasRef} className="w-full h-full absolute" />
        </div>

        <div className="w-[300px]  grid justify-center items-center grid-cols-3">
          <p className="col-span-1 justify-start justify-self-start">
            <span className={status === "Running" ? "text-green-600" : "text-red-500"}>{status}</span>
          </p>
            <div className=' flex justify-center'>
            {isPlaying ? (
            <PauseIcon className="text-foreground text-center self-center col-span-1 cursor-pointer" onClick={() => {
              videoRef.current.pause();
              setIsPlaying(false);
            }} />
          ) : (
            <PlayIcon className="text-foreground text-center self-center col-span-1 cursor-pointer" onClick={() => {
              videoRef.current.play();
              setIsPlaying(true);
            }} />
          )}


            </div>


          

          <RotateCcwIcon
            className={`justify-end justify-self-end text-foreground col-span-1 ${camera === 'user' ? 'rotate-180' : 'rotate-0'} transition-all duration-700`}
            onClick={() => {
              setCamera(prevState => prevState === 'user' ? 'environment' : 'user');
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Page1;
