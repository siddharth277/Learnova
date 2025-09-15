"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useLabels from "@/components/useLabels"; // MongoDB hook

export default function FaceRecognizer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { labels: fetchedLabels, loading: labelsLoading, error } = useLabels();

  const [message, setMessage] = useState("Loading models...");
  const [finished, setFinished] = useState(false);
  const [detectedPerson, setDetectedPerson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confidence, setConfidence] = useState(0);

  const MODEL_URL = "/models";

  // Use labels directly from MongoDB with full image URL
  const labels = fetchedLabels;

  // Retry function
  const handleRetry = () => {
    setFinished(false);
    setMessage("Retrying detection...");
    setDetectedPerson(null);
    setConfidence(0);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    runDetection();
  };

  useEffect(() => {
    let stream;

    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setMessage("Models loaded ✅ Starting webcam...");
      startVideo();
    };

    const startVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsLoading(false);
            runDetection();
          };
        }
      } catch (err) {
        console.error("Webcam error:", err);
        setMessage("Cannot access webcam ❌");
        setFinished(true);
        setIsLoading(false);
      }
    };

    if (!labelsLoading && !error && labels.length > 0) loadModels();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
    // Only run when labels have loaded
  }, [labelsLoading, error]);

  const runDetection = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !labels ||
      labels.length === 0
    )
      return;

    const labeledFaceDescriptors = (
      await Promise.all(
        labels.map(async (student) => {
          try {
            const img = await faceapi.fetchImage(student.image); // full URL from MongoDB
            const detection = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (detection) {
              return new faceapi.LabeledFaceDescriptors(student.name, [
                detection.descriptor,
              ]);
            }
          } catch {
            console.warn(`Image not found: ${student.name}`);
          }
          return null;
        })
      )
    ).filter(Boolean);

    if (!labeledFaceDescriptors.length) {
      setMessage("No labeled faces found ❌");
      setFinished(true);
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const displaySize = {
      width: video.videoWidth || 720,
      height: video.videoHeight || 500,
    };
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (resizedDetections.length > 0) {
      const face = resizedDetections[0];
      const bestMatch = faceMatcher.findBestMatch(face.descriptor);
      const label = bestMatch.label === "unknown" ? "Unknown" : bestMatch.label;
      const confidenceScore = Math.round((1 - bestMatch.distance) * 100);

      const box = face.detection.box;
      ctx.strokeStyle = label !== "Unknown" ? "#10b981" : "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = label !== "Unknown" ? "#10b981" : "#ef4444";
      ctx.fillRect(box.x, box.y - 30, box.width, 30);

      ctx.fillStyle = "white";
      ctx.font = "16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${label} (${confidenceScore}%)`,
        box.x + box.width / 2,
        box.y - 8
      );

      setMessage(`Detected: ${label}`);
      setConfidence(confidenceScore);

      if (label !== "Unknown") {
        const person = labels.find((l) => l.name === label);
        setDetectedPerson(person || null);
      } else {
        setDetectedPerson(null);
      }
    } else {
      setMessage("No face detected");
      setDetectedPerson(null);
      setConfidence(0);
    }

    setFinished(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex flex-col items-center justify-start py-12 px-4">
      {/* Header & Register Button */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-indigo-700 dark:text-indigo-300">
          Face Recognition
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Smart Attendance System
        </p>
        <Link href="/register">
          <Button className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-indigo-200 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
            Register New Face
          </Button>
        </Link>
      </div>

      {/* Video & Canvas */}
      <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-200 dark:border-gray-700">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      </div>

      {/* Status Message & Confidence Bar */}
      <div className="w-full max-w-xl mt-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-md border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-700 dark:text-gray-200 font-medium">
            {message}
          </p>
          {confidence > 0 && (
            <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full mt-2">
              <div
                className="h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-300"
                style={{ width: `${confidence}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detected Person Card */}
      {detectedPerson && (
        <div className="w-full max-w-md mt-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 text-center">
            Recognition Successful!
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2">
              <span className="font-medium text-gray-600 dark:text-gray-300 uppercase">
                Name
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {detectedPerson.name}
              </span>
            </div>
            {detectedPerson.rollNo && (
              <div className="flex justify-between bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2">
                <span className="font-medium text-gray-600 dark:text-gray-300 uppercase">
                  Roll No
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {detectedPerson.rollNo}
                </span>
              </div>
            )}
            {detectedPerson.email && (
              <div className="flex justify-between bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2">
                <span className="font-medium text-gray-600 dark:text-gray-300 uppercase">
                  Email
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-100 break-all">
                  {detectedPerson.email}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan Again Button */}
      {finished && (
        <Button
          onClick={handleRetry}
          className="mt-8 bg-indigo-500 dark:bg-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold px-10 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Scan Again
        </Button>
      )}
    </div>
  );
}
