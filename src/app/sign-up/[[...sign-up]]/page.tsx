import { SignUp } from '@clerk/nextjs'
import { ShoppingCart } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#0F7B6C] flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <span className="text-[#1B3A5C] font-bold text-2xl">Restock</span>
        </div>
        <p className="text-[#1B3A5C]/50 text-sm">Track purchases. Predict restocks. Save money.</p>
      </div>
      <SignUp />
    </div>
  )
}
