import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";


import * as React from "react";
import { useCallback} from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = '/face-rec/models'; // adjust path according to your setup

export function DrawerDemo() {
  const [data, setData] = React.useState<any>({
    name: "",
    id: "",
    position:"",
    photos: [],
  });
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  

 

  const loadModels = useCallback(() => {
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]).then(() => {
      console.log("Models loaded");
    });
  }, []);

  const getFaceDescriptor = useCallback(async (img: HTMLImageElement) => {
    return await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

    setData((prevData:any) => ({
      ...prevData,
      photos: [...prevData.photos, ...files],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setPreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
    setData((prevData:any) => ({
      ...prevData,
      photos: prevData.photos.filter((_:any, i:any) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    const descriptions = await Promise.all(
      data.photos.map(async (file: File) => {
        const img = await faceapi.fetchImage(URL.createObjectURL(file));
        const detection = await getFaceDescriptor(img);


        return detection?.descriptor || [];
      })
    );

    const labeledFaceDescriptors:any = {
      label: data.name,
      descriptors: descriptions.map(descriptor => 
    Object.keys(descriptor)
      .map(key => parseFloat(descriptor[key]))
  )
    };

    const FersonsDescriptors:any = {
        id: data.id,
        name:data.name,
        position: data.position,
      };

    let curFersons = JSON.parse(localStorage.getItem('CurrentFersons')||"")
    let curData = JSON.parse(localStorage.getItem('CurrentData')||"")

    let merge = [...curFersons,FersonsDescriptors]
    
    let merge2 = [...curData,labeledFaceDescriptors]
    
    localStorage.setItem('CurrentFersons',JSON.stringify(merge))
    localStorage.setItem('CurrentData',JSON.stringify(merge2))

    setData((prevData:any) => ({
      ...prevData,
      faceDescriptors: labeledFaceDescriptors,
    }));

    setLoading(false);
    window.location.reload();
    console.log(data);
  };

  React.useEffect(() => {
    loadModels();
  }, [loadModels]);

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Add Face</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Register a Face</DrawerTitle>
            <DrawerDescription>Upload face and wait for the model to train.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex text-foreground gap-4 flex-col justify-center">
              <div className="w-full">
                <p>Label ID</p>
                <input
                  type="text"
                  value={data.id}
                  onChange={(e) => setData({ ...data, id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-gray-600 file:text-sm file:font-medium"
                />
              </div>

              <div className="w-full">
                <p>Name</p>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-gray-600 file:text-sm file:font-medium"
                />
              </div>

              <div className="w-full">
                <p>Position</p>
                <input
                  type="text"
                  value={data.position}
                  onChange={(e) => setData({ ...data, position: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-gray-600 file:text-sm file:font-medium"
                />
              </div>

              <div className="flex-1 text-start w-full">
                <p>Images</p>
                <label className="text-sm text-foreground font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"></label>
                <div className="grid w-full items-start">
                  <input
                    id="picture"
                    onChange={handleFileChange}
                    type="file"
                    multiple
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground file:border-0 file:bg-transparent file:text-gray-600 file:text-sm file:font-medium"
                  />
                </div>
                <div className="preview mt-3 grid grid-cols-3 gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        className="h-[70px] w-full object-contain"
                        alt={`Image Preview ${index}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 h-[120px]"></div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Submit'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
