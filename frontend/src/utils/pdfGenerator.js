import jsPDF from "jspdf";
import api from "@/services/api";
import logoImg from "@/assets/ImageInsight.webp";

const getBase64ImageFromUrl = async (imageUrl) => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generatePdfReport = async (jobId) => {
  // Fetch full details
  const res = await api.get(`/jobs/${jobId}`);
  const job = res.data.data;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4"
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = 40;

  const drawWatermark = () => {
    pdf.setTextColor(18, 18, 18); // Very faint text for dark mode background
    pdf.setFontSize(90);
    pdf.setFont("helvetica", "bold");
    const text = "ImageInsight";
    const textWidth = pdf.getTextWidth(text);
    
    // Calculate offset to center the text when rotated 45 degrees
    const offset = (textWidth / 2) * 0.707; 
    
    pdf.text(text, (pageWidth / 2) - offset, (pageHeight / 2) + offset, {
      angle: 45
    });
  };

  const checkPageBreak = (neededHeight) => {
    if (yPos + neededHeight > pageHeight - 40) {
      pdf.addPage();
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      drawWatermark();
      yPos = 40;
    }
  };

  // Base background
  pdf.setFillColor(10, 10, 10);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  drawWatermark();

  // Title
  yPos = 50;
  try {
    const base64Logo = await getBase64ImageFromUrl(logoImg);
    pdf.addImage(base64Logo, "WEBP", 40, 28, 25, 25);
  } catch (err) {
    console.error("Could not load logo for PDF", err);
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("ImageInsight", 75, yPos);

  // Status
  pdf.setTextColor(16, 185, 129); // emerald-500
  if (job.status === "failed") pdf.setTextColor(239, 68, 68);
  if (job.flagged) pdf.setTextColor(239, 68, 68);
  pdf.setFontSize(12);
  pdf.text((job.flagged ? "FLAGGED" : job.status).toUpperCase(), pageWidth - 100, yPos);

  // Metadata
  yPos += 30;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(150, 150, 150);
  pdf.text(`File: ${job.filename}`, 40, yPos);
  yPos += 15;
  pdf.text(`Date: ${new Date(job.createdAt).toLocaleString()}`, 40, yPos);

  yPos += 30;

  function drawSectionHeader(title, height) {
    checkPageBreak(height);
    pdf.setFillColor(20, 20, 20);
    pdf.rect(40, yPos, pageWidth - 80, 25, "F");
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(title.toUpperCase(), 50, yPos + 17);
    yPos += 40;
  }

  // Render Image
  if (job.imageUrl) {
    try {
      const base64Img = await getBase64ImageFromUrl(job.imageUrl);
      const imgProps = pdf.getImageProperties(base64Img);
      
      const maxWidth = pageWidth - 80;
      const maxHeight = 300;
      
      let finalWidth = maxWidth;
      let finalHeight = (imgProps.height * finalWidth) / imgProps.width;
      
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = (imgProps.width * finalHeight) / imgProps.height;
      }
      
      drawSectionHeader("Source Material", finalHeight + 60);
      const xOffset = 40 + (maxWidth - finalWidth) / 2;

      pdf.addImage(base64Img, "JPEG", xOffset, yPos, finalWidth, finalHeight);
      yPos += finalHeight + 20;
      
      // Add scene/people info underneath
      if (job.scene || job.peopleCount !== undefined || job.isIndoor !== undefined) {
         pdf.setFontSize(10);
         
         if (job.scene) {
             pdf.setFont("helvetica", "bold");
             pdf.setTextColor(200, 200, 200);
             pdf.text("Scene:", 40, yPos);
             pdf.setFont("helvetica", "normal");
             pdf.setTextColor(150, 150, 150);
             const splitScene = pdf.splitTextToSize(job.scene, pageWidth - 100);
             pdf.text(splitScene, 85, yPos);
             yPos += (splitScene.length * 15) + 5;
         }
         
         if (job.peopleCount !== undefined) {
             pdf.setFont("helvetica", "bold");
             pdf.setTextColor(200, 200, 200);
             pdf.text("People:", 40, yPos);
             pdf.setFont("helvetica", "normal");
             pdf.setTextColor(150, 150, 150);
             pdf.text(String(job.peopleCount), 85, yPos);
             yPos += 20;
         }
         
         if (job.isIndoor !== undefined) {
             pdf.setFont("helvetica", "bold");
             pdf.setTextColor(200, 200, 200);
             pdf.text("Environment:", 40, yPos);
             pdf.setFont("helvetica", "normal");
             pdf.setTextColor(150, 150, 150);
             pdf.text(job.isIndoor ? "Indoor" : "Outdoor", 115, yPos);
             yPos += 20;
         }
         
         yPos += 10;
      }
    } catch (err) {
      console.error("Image load failed", err);
    }
  }

  // Caption
  if (job.caption) {
    drawSectionHeader("Generated Caption", 80);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(230, 230, 230);
    const splitCaption = pdf.splitTextToSize(`"${job.caption}"`, pageWidth - 80);
    pdf.text(splitCaption, 40, yPos);
    yPos += (splitCaption.length * 15) + 30;
  }
  
  // SafeSearch
  if (job.safeSearch) {
      drawSectionHeader("Content Safety Analysis", 100);
      pdf.setFontSize(10);
      const cats = ["adult", "violence", "medical", "racy", "spoof"];
      
      let currentY = yPos;
      cats.forEach((cat, idx) => {
         const col = idx % 2;
         const row = Math.floor(idx / 2);
         const x = 40 + (col * (pageWidth / 2 - 40));
         const y = currentY + (row * 20);
         
         pdf.setTextColor(150, 150, 150);
         pdf.setFont("helvetica", "bold");
         pdf.text(cat.toUpperCase(), x, y);
         
         const level = job.safeSearch[cat] || "UNKNOWN";
         let valColor = [16, 185, 129];
         if (level.includes("POSSIBLE")) valColor = [251, 191, 36];
         if (level.includes("LIKELY") && level !== "UNLIKELY" && level !== "VERY_UNLIKELY") valColor = [239, 68, 68];
         
         pdf.setTextColor(...valColor);
         pdf.text(level.replace(/_/g, " "), x + 80, y);
      });
      yPos = currentY + (Math.ceil(cats.length / 2) * 20) + 20;
  }

  // Detected Objects
  if (job.detectedObjects && job.detectedObjects.length > 0) {
     drawSectionHeader(`Object Detection Results (${job.detectedObjects.length} Entities)`, 100);
     
     // Table Header
     pdf.setTextColor(100, 100, 100);
     pdf.setFontSize(9);
     pdf.setFont("helvetica", "bold");
     pdf.text("LABEL", 40, yPos);
     pdf.text("CONFIDENCE", pageWidth - 100, yPos);
     yPos += 15;
     
     pdf.setDrawColor(40, 40, 40);
     pdf.line(40, yPos, pageWidth - 40, yPos);
     yPos += 15;

     pdf.setFontSize(11);
     job.detectedObjects.forEach((obj) => {
         checkPageBreak(30);
         pdf.setTextColor(230, 230, 230);
         pdf.setFont("helvetica", "bold");
         let nameStr = obj.name;
         if (obj.count > 1) nameStr += `   x${obj.count}`;
         pdf.text(nameStr, 40, yPos);
         
         pdf.setTextColor(16, 185, 129);
         pdf.text(`${(obj.confidence * 100).toFixed(1)}%`, pageWidth - 80, yPos);
         
         yPos += 10;
         pdf.setDrawColor(30, 30, 30);
         pdf.line(40, yPos, pageWidth - 40, yPos);
         yPos += 15;
     });
     yPos += 10;
  }

  // Labels
  if (job.labelDetails && job.labelDetails.length > 0) {
     drawSectionHeader("General Labels", 100);
     
     job.labelDetails.forEach((label) => {
         checkPageBreak(30);
         pdf.setFontSize(10);
         pdf.setTextColor(200, 200, 200);
         pdf.setFont("helvetica", "bold");
         pdf.text(label.description, 40, yPos);
         
         if (label.score) {
            pdf.setTextColor(16, 185, 129);
            pdf.text(`${(label.score * 100).toFixed(1)}%`, pageWidth - 80, yPos);
            
            yPos += 8;
            // Draw progress bar background
            pdf.setFillColor(30, 30, 30);
            pdf.roundedRect(40, yPos, pageWidth - 80, 4, 2, 2, "F");
            
            // Draw progress bar fill
            const fillWidth = (pageWidth - 80) * label.score;
            pdf.setFillColor(16, 185, 129);
            pdf.roundedRect(40, yPos, fillWidth, 4, 2, 2, "F");
            yPos += 20;
         } else {
            yPos += 20;
         }
     });
  }

  pdf.save(`CamarinAI_${job.filename}_Report.pdf`);
};
