"""Tools the Ownerless Switch agents use to investigate and repair the demo data platform."""

__version__ = "0.1.0"


class OwnerlessError(RuntimeError):
    """A failure worth showing to the agent as a one-line error, not a traceback."""
