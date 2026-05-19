import React from "react";

export default function Declaration({
  formData,
  setFormData,
  readOnly,
  setIsDirty,
}) {
  const today = new Date().toISOString().split("T")[0];
  const declaration = formData.declaration || {};

  /* ---------------- FILE HELPERS ---------------- */

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleFileChange = async (field, file) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2MB");
      const input = document.getElementById(`${field}Upload`);
      if (input) input.value = "";
      return;
    }

    const base64 = await toBase64(file);

    setFormData((prev) => ({
      ...prev,
      declaration: {
        ...(prev.declaration || {}),
        [field]: {
          name: file.name,
          data: base64,
        },
      },
    }));

    setIsDirty(true);
    const input = document.getElementById(`${field}Upload`);
    if (input) input.value = "";
  };

  const removeFile = (field) => {
    setFormData((prev) => ({
      ...prev,
      declaration: {
        ...(prev.declaration || {}),
        [field]: null,
      },
    }));
    setIsDirty(true);
    const input = document.getElementById(`${field}Upload`);
    if (input) input.value = "";
  };

  const handleView = (fileData) => {
    if (!fileData) return;
    if (fileData.startsWith("http")) {
      window.open(fileData, "_blank");
      return;
    }
    try {
      const arr = fileData.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error("Error rendering file", e);
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${fileData}" width="100%" height="100%" style="border:0;"></iframe>`
        );
      }
    }
  };

  /* ---------------- DECLARATION UPDATE ---------------- */

  const updateDeclaration = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      declaration: {
        ...(prev.declaration || {}),
        [field]: value,
      },
    }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ================== 📂 CARD 1: UPLOAD DOCUMENTS ================== */}
      <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
        <h3 className="text-md font-semibold text-gray-800 mb-6">
          Upload Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Aadhaar */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Aadhaar Card
            </label>

            <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-500">
              <input
                type="file"
                id="aadhaarUpload"
                className="hidden"
                disabled={readOnly}
                onChange={(e) =>
                  handleFileChange("aadhaar", e.target.files[0])
                }
              />
              <label htmlFor="aadhaarUpload" className="cursor-pointer">
                Drop file here or click to upload
              </label>
            </div>

            {declaration.aadhaar && (
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                📄 {declaration.aadhaar.name}

                <button
                  className="text-blue-600"
                  onClick={() => handleView(declaration.aadhaar.data)}
                >
                  View
                </button>

                {!readOnly && (
                  <button
                    className="text-red-500"
                    onClick={() => removeFile("aadhaar")}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PAN */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              PAN Card
            </label>

            <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-500">
              <input
                type="file"
                id="panUpload"
                className="hidden"
                disabled={readOnly}
                onChange={(e) =>
                  handleFileChange("pan", e.target.files[0])
                }
              />
              <label htmlFor="panUpload" className="cursor-pointer">
                Drop file here or click to upload
              </label>
            </div>

            {declaration.pan && (
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                📄 {declaration.pan.name}

                <button
                  className="text-blue-600"
                  onClick={() => handleView(declaration.pan.data)}
                >
                  View
                </button>

                {!readOnly && (
                  <button
                    className="text-red-500"
                    onClick={() => removeFile("pan")}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SSLC */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              All Marks Sheets
            </label>

            <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-500">
              <input
                type="file"
                id="sslcUpload"
                className="hidden"
                disabled={readOnly}
                onChange={(e) =>
                  handleFileChange("sslc", e.target.files[0])
                }
              />
              <label htmlFor="sslcUpload" className="cursor-pointer">
                Drop file here or click to upload
              </label>
            </div>

            {declaration.sslc && (
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                📄 {declaration.sslc.name}

                <button
                  className="text-blue-600"
                  onClick={() => handleView(declaration.sslc.data)}
                >
                  View
                </button>

                {!readOnly && (
                  <button
                    className="text-red-500"
                    onClick={() => removeFile("sslc")}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================== 📝 CARD 2: DECLARATION ================== */}
      <div className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
        <h3 className="text-md font-semibold text-gray-800 mb-4">
          Declaration
        </h3>

        <p className="text-sm text-gray-700 leading-relaxed">
          I declare that the above information is correct to the best of my
          knowledge. I authorize the company to verify the details at any point
          of time.
        </p>

        {/* Checkbox */}
        <div className="flex items-start gap-2 mt-4">
          <input
            type="checkbox"
            checked={declaration.agreed || false}
            disabled={readOnly}
            onChange={(e) =>
              updateDeclaration("agreed", e.target.checked)
            }
          />
          <label className="text-sm">
            I agree to the above declaration
          </label>
        </div>

        {/* Signature */}
        <div className="mt-4">
          <label className="text-sm font-medium">
            Digital Signature (Full Name)
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={declaration.signature || ""}
            disabled={readOnly}
            onChange={(e) =>
              updateDeclaration("signature", e.target.value)
            }
            className="mt-1 w-full border-b outline-none px-2 py-1"
          />
        </div>

        {/* Date & Place */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Date:</label>
            <input
              type="date"
              value={today}
              disabled
              className="ml-3 border-b bg-gray-50 px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Place:</label>
            <input
              type="text"
              placeholder="Enter Place"
              value={declaration.place || ""}
              disabled={readOnly}
              onChange={(e) =>
                updateDeclaration("place", e.target.value)
              }
              className="ml-3 border-b outline-none px-2 py-1"
            />
          </div>
        </div>
      </div>

    </div>
  );
}