import React, { useRef } from "react";

const TestUpload = () => {
  console.log("TestUpload component loaded");

  // יצירת רפרנס ל-input
  const inputRef = useRef(null);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Test Upload JSON</h2>
      <label style={{ cursor: "pointer" }}>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files[0];
            if (!file) {
              console.error("No file selected");
              alert("Please select a file.");
              return;
            }

            console.log("File selected:", file.name);

            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const jsonData = JSON.parse(e.target.result);
                console.log("Parsed JSON data:", jsonData);
                alert("JSON uploaded successfully!");
              } catch (error) {
                console.error("Error parsing JSON:", error);
                alert("Invalid JSON file. Please upload a valid JSON.");
              }
            };

            reader.onerror = (error) => {
              console.error("Error reading file:", error);
              alert("Error reading file. Please try again.");
            };

            reader.readAsText(file);
          }}
        />
        <button
          onClick={() => {
            // הפעלת ה-input בלחיצה על הכפתור
            if (inputRef.current) {
              inputRef.current.click();
            }
          }}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 15px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Upload JSON
        </button>
      </label>
    </div>
  );
};

export default TestUpload;
