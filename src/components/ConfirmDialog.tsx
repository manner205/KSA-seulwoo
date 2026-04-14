interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 dimmer */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-xl p-6 mx-5 w-full max-w-sm">
        <p className="text-base font-medium text-slate-800 text-center mb-6 whitespace-pre-line">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-300
                       text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600
                       text-sm font-medium text-white"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
