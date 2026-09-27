from pathlib import Path
import shutil

SOURCE = Path("dataset")
OUTPUT = Path("dataset_clean")

# Start fresh
if OUTPUT.exists():
    shutil.rmtree(OUTPUT)

# Copy the dataset structure/files
for split in ["train", "valid", "test"]:
    (OUTPUT / split / "images").mkdir(parents=True, exist_ok=True)
    (OUTPUT / split / "labels").mkdir(parents=True, exist_ok=True)

    # Copy images
    for img in (SOURCE / split / "images").iterdir():
        if img.is_file():
            shutil.copy2(img, OUTPUT / split / "images" / img.name)

    # Convert labels
    for label_file in (SOURCE / split / "labels").glob("*.txt"):
        output_file = OUTPUT / split / "labels" / label_file.name

        converted = []

        for line in label_file.read_text().splitlines():
            values = line.strip().split()

            if not values:
                continue

            # Already a YOLO bounding box:
            # class x_center y_center width height
            if len(values) == 5:
                converted.append(" ".join(values))
                continue

            # Segmentation polygon:
            # class x1 y1 x2 y2 x3 y3 ...
            if len(values) >= 7 and (len(values) - 1) % 2 == 0:
                class_id = values[0]
                coords = list(map(float, values[1:]))

                xs = coords[0::2]
                ys = coords[1::2]

                # Convert polygon -> bounding box
                x_min = min(xs)
                x_max = max(xs)
                y_min = min(ys)
                y_max = max(ys)

                x_center = (x_min + x_max) / 2
                y_center = (y_min + y_max) / 2
                width = x_max - x_min
                height = y_max - y_min

                converted.append(
                    f"{class_id} "
                    f"{x_center:.6f} "
                    f"{y_center:.6f} "
                    f"{width:.6f} "
                    f"{height:.6f}"
                )

        output_file.write_text(
            "\n".join(converted) + ("\n" if converted else "")
        )

# Copy data.yaml
shutil.copy2(
    SOURCE / "data.yaml",
    OUTPUT / "data.yaml"
)

print("Conversion complete.")
print(f"Clean dataset created at: {OUTPUT.resolve()}")