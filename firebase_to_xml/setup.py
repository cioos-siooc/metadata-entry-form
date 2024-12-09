#!/usr/bin/env python3

"""
Setup file for firebase_to_yaml
"""

from distutils.core import setup

setup(
    name="firebase_to_xml",
    version="0.2",
    description="Python module translates metadata records from" + "Firebase into XML",
    url="https://github.com/cioos-siooc/metadata-entry-form",
    packages=["firebase_to_xml"],
    package_data={'firebase_to_xml': ['resources/*.json']},
    include_package_data=True,

    install_requires=[
        "google-auth>=2.36.0",
        "google-oauth>=1.0.1",
        "loguru>=0.7.3",
        "python-dotenv>=1.0.1",
        "metadata_xml@git+https://github.com/cioos-siooc/metadata-xml.git",
        "loguru>=0.7.3",
        "tqdm>=4.67.1",
    ],
    extras_require={
        'dev': [
            "ruff>=0.8.2",
        ],
    },
)
