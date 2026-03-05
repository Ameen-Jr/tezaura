import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import animationData from "../assets/blueberry-cartoon.json";

export default function InteractiveMascot() {
  const containerRef = useRef(null);

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData,
    });

    const handleMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);

      const x = Math.max(-6, Math.min(6, dx / 25));
      const y = Math.max(-6, Math.min(6, dy / 25));

      const svg = containerRef.current.querySelector("svg");
      if (svg) {
        svg.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    const reset = () => {
      const svg = containerRef.current.querySelector("svg");
      if (svg) svg.style.transform = "translate(0,0)";
    };

    const el = containerRef.current;
    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", reset);

    return () => {
      anim.destroy();
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
  <div
    ref={containerRef}
    style={{
      width: 72,
      height: 72,
      cursor: "pointer",
      flexShrink: 0,
      transform: "scaleX(-1)",   // MIRROR
    }}
  />
);

}
