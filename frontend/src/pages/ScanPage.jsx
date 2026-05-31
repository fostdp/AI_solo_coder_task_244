import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicineApi } from '../utils/api'

function ScanPage() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState(null)
  const [cameraMode, setCameraMode] = useState(false)
  const [facingMode, setFacingMode] = useState('environment')
  const [showManualEdit, setShowManualEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editExpiry, setEditExpiry] = useState('')

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const startCamera = async () => {
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setCameraMode(true)
    } catch (err) {
      setError('无法访问摄像头: ' + err.message)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setCameraMode(false)
    setCapturedImage(null)
  }

  const toggleFacingMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    if (stream) {
      stopCamera()
      setTimeout(() => {
        setFacingMode(newMode)
        startCamera()
      }, 100)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageDataUrl)
      stopCamera()
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCapturedImage(event.target.result)
        setCameraMode(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const performScan = async () => {
    if (!capturedImage) return

    setScanning(true)
    setError(null)
    try {
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' })
      
      const result = await medicineApi.scan(file)
      setScanResult(result)
    } catch (err) {
      setError('扫描失败: ' + err.message)
    } finally {
      setScanning(false)
    }
  }

  const useScanResult = () => {
    if (scanResult) {
      navigate('/add', {
        state: {
          name: scanResult.name,
          expiry_date: scanResult.expiry_date,
        },
      })
    }
  }

  const resetScan = () => {
    setCapturedImage(null)
    setScanResult(null)
    setError(null)
    setShowManualEdit(false)
    setEditName('')
    setEditExpiry('')
  }

  const openManualEdit = () => {
    setEditName(scanResult?.name || '')
    setEditExpiry(scanResult?.expiry_date || '')
    setShowManualEdit(true)
  }

  const useManualEdit = () => {
    if (!editName.trim()) {
      setError('请输入药品名称')
      return
    }
    if (!editExpiry) {
      setError('请选择有效期')
      return
    }
    navigate('/add', {
      state: {
        name: editName,
        expiry_date: editExpiry,
      },
    })
  }

  return (
    <div className="min-h-screen">
      <header className="bg-primary-500 text-white px-4 py-4">
        <h1 className="text-xl font-bold">扫描有效期</h1>
        <p className="text-primary-100 text-sm mt-1">将药盒上的有效期对准镜头</p>
      </header>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <main className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {cameraMode ? (
          <div className="relative bg-black rounded-xl overflow-hidden aspect-square mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 border-2 border-primary-500 rounded-lg"></div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="w-14 h-14 rounded-full bg-gray-600 text-white flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={captureImage}
                className="w-16 h-16 rounded-full bg-white border-4 border-primary-500 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary-500"></div>
              </button>
              <button
                onClick={toggleFacingMode}
                className="w-14 h-14 rounded-full bg-gray-600 text-white flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full aspect-square object-cover"
              />
            </div>

            {!scanResult && !scanning && (
              <div className="flex gap-3">
                <button
                  onClick={resetScan}
                  className="flex-1 btn-secondary"
                >
                  重新拍摄
                </button>
                <button
                  onClick={performScan}
                  className="flex-1 btn-primary"
                >
                  开始识别
                </button>
              </div>
            )}

            {scanning && (
              <div className="card text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-600">正在识别图片...</p>
                <p className="text-gray-400 text-sm mt-2">OCR识别可能需要几秒钟</p>
              </div>
            )}

            {scanResult && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">识别结果</h3>
                  <button
                    onClick={openManualEdit}
                    className="text-sm text-primary-500 hover:text-primary-600"
                  >
                    手动修改
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">药品名称</label>
                    <p className="text-lg font-medium">{scanResult.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">有效期</label>
                    <p className={`text-lg font-medium ${scanResult.expiry_date ? '' : 'text-red-500'}`}>
                      {scanResult.expiry_date || '未识别到'}
                    </p>
                  </div>

                  {!scanResult.expiry_date && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-orange-600 text-sm">
                        ⚠️ 未能自动识别有效期，建议点击"手动修改"录入
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={resetScan}
                    className="flex-1 btn-secondary"
                  >
                    重新扫描
                  </button>
                  <button
                    onClick={openManualEdit}
                    className="flex-1 btn-secondary"
                  >
                    手动录入
                  </button>
                  <button
                    onClick={useScanResult}
                    disabled={!scanResult.expiry_date}
                    className={`flex-1 ${scanResult.expiry_date ? 'btn-primary' : 'bg-gray-300 text-gray-500 cursor-not-allowed font-medium py-2 px-4 rounded-lg'}`}
                  >
                    确认添加
                  </button>
                </div>
              </div>
            )}

            {showManualEdit && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-semibold mb-4">手动录入药品信息</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        药品名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="例如：阿莫西林"
                        className="input-field"
                        autoFocus
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        有效期 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={editExpiry}
                        onChange={(e) => setEditExpiry(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowManualEdit(false)}
                      className="flex-1 btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      onClick={useManualEdit}
                      className="flex-1 btn-primary"
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card text-center py-12">
              <svg className="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500 mb-2">使用摄像头扫描药盒</p>
              <p className="text-gray-400 text-sm">系统将自动识别有效期</p>
            </div>

            <button
              onClick={startCamera}
              className="w-full btn-primary py-4 text-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                打开摄像头
              </span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-secondary py-4"
            >
              从相册选择图片
            </button>
          </div>
        )}

        <div className="mt-6 card">
          <h4 className="font-medium mb-2">💡 扫描提示</h4>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• 确保光线充足</li>
            <li>• 将有效期对准扫描框</li>
            <li>• 保持手机稳定</li>
            <li>• 尽量让文字清晰</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default ScanPage
