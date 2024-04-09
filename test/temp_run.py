import csv
from datetime import datetime

def convert_to_unix_epoch(timestamp):
    dt_obj = datetime.strptime(timestamp, "%Y-%m-%d")
    return int(dt_obj.timestamp())

def update_timestamp_to_epoch(input_csv, output_csv):
    with open(input_csv, 'r') as infile, open(output_csv, 'w', newline='') as outfile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            row['TimeStamp'] = convert_to_unix_epoch(row['TimeStamp'])
            writer.writerow(row)

input_csv_file = "./data/loggedData.csv"  # Change this to your input CSV file path
output_csv_file = "output_data.csv"  # Change this to your output CSV file path

update_timestamp_to_epoch(input_csv_file, output_csv_file)
print("Conversion complete. Updated data saved to", output_csv_file)
