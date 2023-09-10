#!/bin/bash

# Path to the source folder
source_folder="/home/office/Web/MarpaLive/admin/export"

# Remote server details
remote_ip="192.168.4.6"
remote_user="sekhar"
remote_password="lineageholder"

# Remote directories
public_remote_dir="/samba/public/Daily recordings 每日上課音頻"
shedra_remote_dir="/samba/shedra/Recordings 上課音頻 (Khenpo+Riklam)"
vinaya_remote_dir="/samba/vinaya/Recordings 上課音頻"

# Archive folder path
archive_folder="/home/office/Web/MarpaLive/admin/export/copied_to_server"

# Create archive folder if it doesn't exist
mkdir -p "$archive_folder"

# Search for files in the source folder
files_to_copy=$(find "$source_folder" -type f)

for file in $files_to_copy; do
    filename=$(basename "$file")
    
    if grep -qE 'WPMT|TIB' <<< "$filename"; then
        remote_dir="$public_remote_dir"
    elif grep -qE 'VIN' <<< "$filename"; then
        remote_dir="$vinaya_remote_dir"
    elif grep -qE 'RIG|TV' <<< "$filename"; then
        remote_dir="$shedra_remote_dir"
    else
        echo "File '$filename' doesn't match any transfer rule. Skipping."
        continue
    fi
    
    # Rsync to copy the file to the remote server
    rsync -e "sshpass -p $remote_password ssh -o StrictHostKeyChecking=no" "$file" "$remote_user@$remote_ip:\"$remote_dir/\""
    
    if [ $? -eq 0 ]; then
        echo "File '$filename' successfully copied to remote directory '$remote_dir'."
        mv "$file" "$archive_folder/$filename"
    else
        echo "Failed to copy file '$filename' to remote directory '$remote_dir'."
    fi
done

