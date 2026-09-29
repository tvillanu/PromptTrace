from PIL import Image

# Open your mountain logo image
img = Image.open("prompttrace.png")

# Save as PNG in standard extension dimensions
img.resize((16, 16)).save("prompttrace16.png", "PNG")
img.resize((32, 32)).save("prompttrace32.png", "PNG")
img.resize((48, 48)).save("prompttrace48.png", "PNG")
img.resize((128, 128)).save("prompttrace128.png", "PNG")