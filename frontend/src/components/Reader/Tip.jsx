import React, { Component } from "react";
import "../styles/Tip.css";

class Tip extends Component {
    state = {
        compact: true,
        text: "",
    };

    // for TipContainer
    componentDidUpdate(nextProps, nextState) {
        const { onUpdate } = this.props;

        if (onUpdate && this.state.compact !== nextState.compact) {
            onUpdate();
        }
    }

    render() {
        const { onConfirm, onOpen } = this.props;
        const { compact, text } = this.state;

        return (
            <div className="Tip">
                {compact ? (
                    <div
                        className="Tip__compact"
                        onClick={() => {
                            onOpen();
                            this.setState({ compact: false });
                        }}
                    >
                        Add highlight
                    </div>
                ) : (
                    <form
                        className="Tip__card"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onConfirm({ text, emoji: "" });
                        }}
                    >
                        <div>
                            <textarea
                                width="100%"
                                placeholder="Your comment"
                                autoFocus
                                value={text}
                                onChange={(event) =>
                                    this.setState({ text: event.target.value })
                                }
                                ref={(node) => {
                                    if (node) {
                                        node.focus();
                                    }
                                }}
                            />
                            <div>
                                {["💩", "😱", "😍", "🔥", "😳", "⚠️"].map((emoji) => (
                                    <label key={emoji}>
                                        <input
                                            checked={this.state.emoji === emoji}
                                            type="radio"
                                            name="emoji"
                                            value={emoji}
                                            onChange={(event) =>
                                                this.setState({ emoji: event.target.value })
                                            }
                                        />
                                        {emoji}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <input type="submit" value="Save" />
                        </div>
                    </form>
                )}
            </div>
        );
    }
}

export default Tip;
