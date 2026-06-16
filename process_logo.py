from rembg import remove
from PIL import Image
import numpy as np

# Load the original image
input_path = "/home/yash/.gemini/antigravity/brain/5b004dfd-dde3-4792-9e67-d4e0bbe9add5/media__1781608256906.png"
input_img = Image.open(input_path).convert("RGBA")

# Use rembg to perfectly remove the background
# This preserves perfect anti-aliasing edges via alpha matting
output_img = remove(input_img)

# Convert to numpy array for fast manipulation
data = np.array(output_img)
r, g, b, a = data[..., 0], data[..., 1], data[..., 2], data[..., 3]

# Identify pixels that are dark blue/greyish (the "Civic" and bottom tagline text)
# We ONLY want to affect pixels that are not fully transparent
dark_mask = (r < 80) & (g < 80) & (b < 120) & (a > 0)

# Replace the color with White, but KEEP the alpha exactly the same!
data[dark_mask, 0] = 255
data[dark_mask, 1] = 255
data[dark_mask, 2] = 255

# Identify any green/orange parts if they need brightness?
# The green and orange are already bright enough for dark mode, so leave them alone.

final_img = Image.fromarray(data)
final_img.save("/home/yash/Documents/Projects/Civic-Mobile/assets/images/civic_logo_transparent.png", "PNG")
print("Perfect transparent dark-mode logo generated!")
