from firebase_to_xml import dump_all
import click
from pathlib import Path
import os
from dotenv import load_dotenv

import shutil

load_dotenv()

FIREBASE_SERVICE_ACCOUNT_KEY = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
if not FIREBASE_SERVICE_ACCOUNT_KEY:
    FIREBASE_SERVICE_ACCOUNT_KEY = Path("key.json")

def clean_directory(directory_path: str | Path, preserve_dir: bool = True) -> None:
    """Delete all files and subdirectories in specified directory.
    
    Args:
        directory_path: Path to directory to clean
        preserve_dir: If True, keeps empty directory. If False, removes directory too.
    """
    directory = Path(directory_path)
    
    if not directory.exists():
        return
        
    if preserve_dir:
        for item in directory.iterdir():
            if item.is_file():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)
    else:
        shutil.rmtree(directory)


@click.command()
@click.option(
    "--regions",
    required=True,
    help="List comma separated list of regions to retrieve records from",
)
@click.option(
    "--key",
    required=True,
    help="Path to firebase OAuth2 key file",
    envvar="FIREBASE_KEY_PATH",
)
@click.option(
    "--output_dir",
    "--out",
    required=True,
    help="Folder to save xml",
    envvar="OUTPUT_DIR",
)
@click.option(
    "--database_url",
    required=True,
    envvar="FIREBASE_DATABASE_URL",
    help="Firebase database URL",
)
@click.option(
    "--also-save-yaml",
    "--yaml",
    is_flag=True,
    help="Whether to output yaml file as well as xml",
    envvar="ALSO_SAVE_YAML",
)

@click.option(
    "--encoding",
    default="utf-8",
    help="Encoding of the output files",
)
@click.option(
    "--clean",
    is_flag=True,
    help="Clean the output directory before updating",
)
def update_all_data(regions, key, output_dir, database_url, also_save_yaml, encoding, clean):
    if clean:
        clean_directory(output_dir, preserve_dir=False)
        
    dump_all.main(regions, key, output_dir, database_url, also_save_yaml, encoding)


if __name__ == "__main__":
    update_all_data()
