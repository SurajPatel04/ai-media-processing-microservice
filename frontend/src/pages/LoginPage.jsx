import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SignupFormDemo from "@/components/signup-form-demo";
import api from "@/services/api";
import { IconBrandGithub } from "@tabler/icons-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (values) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/auth/login", values);
      toast.success("LOGGED IN SUCCESSFULLY");
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed";
      setError(errorMsg);
      toast.error(errorMsg.toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-8 left-8 md:left-12">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/src/assets/ImageInsight.webp" alt="Logo" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold tracking-tight text-white">ImageInsight</span>
        </Link>
      </div>
      <div className="absolute top-8 right-8 md:right-12">
        <a
          href="https://github.com/SurajPatel04"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          title="GitHub Repository"
        >
          <IconBrandGithub className="h-6 w-6" />
          <span className="hidden sm:inline text-sm font-medium">GitHub</span>
        </a>
      </div>
      <div className="w-full max-w-md">
        <SignupFormDemo
          error={error}
          isLoading={isLoading}
          mode="login"
          onSubmit={handleSubmit}
        />
        <p className="mt-3 text-center text-sm text-neutral-300">
          Need an account?{" "}
          <button
            className="font-medium text-white underline bg-transparent border-none cursor-pointer p-0"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
