from rembg import remove
from PIL import Image
import numpy as np

# Load the NEW image
input_path = "/home/yash/.gemini/antigravity/brain/5b004dfd-dde3-4792-9e67-d4e0bbe9add5/media__1781609189054.png"
input_img = Image.open(input_path).convert("RGBA")

# Use rembg to perfectly remove any remaining white background
output_img = remove(input_img)

# Convert to numpy array for fast manipulation
data = np.array(output_img)
r, g, b, a = data[..., 0], data[..., 1], data[..., 2], data[..., 3]

# Identify pixels that are dark blue/greyish (the "CivicConnect" text)
dark_mask = (r < 80) & (g < 80) & (b < 120) & (a > 0)

# Replace the dark color with White, perfectly preserving the alpha!
data[dark_mask, 0] = 255
data[dark_mask, 1] = 255
data[dark_mask, 2] = 255

final_img = Image.fromarray(data)
final_img.save("/home/yash/Documents/Projects/Civic-Mobile/assets/images/civic_logo_transparent.png", "PNG")
print("New logo processed: background removed and dark text turned white!")
