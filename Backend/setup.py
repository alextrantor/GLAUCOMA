from setuptools import setup

setup(
    name="glaucoma-api",
    version="1.0.0",
    install_requires=[
        "setuptools>=65.5.1",
        "tensorflow-cpu>=2.12.0",
        "fastapi>=0.95.2"
    ],
    python_requires=">=3.9,<3.10"
)