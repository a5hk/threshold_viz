# Threshold

This visualization app lets you choose different colors for different ranges of values by adjusting the thresholds.

### Examples

```
| tstats prestats=t count where index=_internal by _time span=1m
| timechart span=1m count
```

![timeline](/static/timeline.png)

## License

[MIT License](LICENSE)
