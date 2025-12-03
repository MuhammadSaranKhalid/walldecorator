"use client";

import { useEffect, useState } from "react";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon,
  EmailIcon,
} from "react-share";
import { Share2 } from "lucide-react";

interface ProductShareProps {
  productName: string;
  productDescription?: string;
  price?: number;
}

export function ProductShare({
  productName,
  productDescription,
  price,
}: ProductShareProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Get the current URL on the client side
    setShareUrl(window.location.href);

    // Check if native share API is available
    setCanShare(!!navigator.share);
  }, []);

  // Use native Web Share API if available
  const handleNativeShare = async () => {
    if (!navigator.share || !shareUrl) return;

    try {
      await navigator.share({
        title: productName,
        text: productDescription || `Check out ${productName} at WallDecorator`,
        url: shareUrl,
      });
    } catch (error) {
      // User cancelled or share failed (silently handle)
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  };

  // Prepare share content
  const shareTitle = price ? `${productName} - $${price}` : productName;
  const shareDescription = productDescription || `Check out ${productName} - Premium wall decor from WallDecorator`;
  const emailSubject = `Check out ${productName} at WallDecorator`;
  const emailBody = `I found this amazing product and thought you might like it!\n\n${productName}${price ? ` - $${price}` : ""}\n\n${shareDescription}\n\nView it here: `;

  if (!shareUrl) {
    return null; // Don't render until URL is available
  }

  return (
    <div className="flex items-center gap-4 border-t pt-6">
      <span className="text-sm font-bold">Share:</span>
      <div className="flex gap-3">
        {/* Facebook Share */}
        <FacebookShareButton
          url={shareUrl}
          hashtag="#WallDecorator"
          className="hover:opacity-80 transition-opacity"
        >
          <FacebookIcon size={32} round />
        </FacebookShareButton>

        {/* Twitter Share */}
        <TwitterShareButton
          url={shareUrl}
          title={shareTitle}
          hashtags={["WallDecorator", "HomeDecor", "WallArt"]}
          className="hover:opacity-80 transition-opacity"
        >
          <TwitterIcon size={32} round />
        </TwitterShareButton>

        {/* WhatsApp Share */}
        <WhatsappShareButton
          url={shareUrl}
          title={shareTitle}
          separator=" - "
          className="hover:opacity-80 transition-opacity"
        >
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>

        {/* LinkedIn Share */}
        <LinkedinShareButton
          url={shareUrl}
          title={productName}
          summary={shareDescription}
          source="WallDecorator"
          className="hover:opacity-80 transition-opacity"
        >
          <LinkedinIcon size={32} round />
        </LinkedinShareButton>

        {/* Email Share */}
        <EmailShareButton
          url={shareUrl}
          subject={emailSubject}
          body={emailBody}
          className="hover:opacity-80 transition-opacity"
        >
          <EmailIcon size={32} round />
        </EmailShareButton>

        {/* Native Share API (Mobile) */}
        {canShare && (
          <button
            onClick={handleNativeShare}
            className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center"
            aria-label="Share using device"
          >
            <Share2 className="h-8 w-8" />
          </button>
        )}
      </div>
    </div>
  );
}
