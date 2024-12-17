from firebase_to_xml.__main__ import main as retrieve_records
from pathlib import Path
import sys
from loguru import logger
import click

@logger.catch
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
)
@click.option(
    "--output_dir",
    "--out",
    required=True,
    help="Folder to save xml",
)
@click.option(
    "--database_url",
    required=True,
    envvar="DATABASE_URL",
    help="Firebase database URL",
)
@click.option(
    "--also-save-yaml",
    "--yaml",
    is_flag=True,
    help="Whether to output yaml file as well as xml",
)
@click.option(
    "--encoding",
    default="utf-8",
    help="Encoding of the output files",
)
@click.option(
    "--log-level",
    default="WARNING",
    help="Logging level",
)
def main(regions,key,output_dir,database_url,also_save_yaml=False,encoding='utf-8', log_level='WARNING'):

    logger.remove()
    logger.add(sys.stderr, level=log_level)

    output_dir = Path(output_dir)
    for region in regions.split(','):
        logger.info("Retrieve {} published records", region)
        retrieve_records(
            record_url=None,
            also_save_yaml=also_save_yaml,
            encoding=encoding,
            xml_directory=output_dir/region,
            region=region,
            status='published',
            database_url=database_url,
            key=key
        )
        logger.info("Retrieve {} unpublished records", region)
        retrieve_records(
            record_url=None,
            also_save_yaml=also_save_yaml,
            encoding=encoding,
            xml_directory=output_dir / "unpublished" / region,
            region=region,
            status='submitted',
            database_url=database_url,
            key=key
        )

if __name__ == "__main__":
    main()