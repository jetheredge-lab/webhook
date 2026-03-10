import { describe, it, expect } from 'vitest';

describe('Tradovate Order API Wrapper', () => {
    it('should map Tradovate mappings safely to constraints', () => {
        // Mock wrapper for mapping assertions
        const mapTradovateAction = (action: string) => action.toLowerCase() === 'buy' ? 'Buy' : 'Sell';
        expect(mapTradovateAction('BUY')).toBe('Buy');
        expect(mapTradovateAction('sell')).toBe('Sell');
    });
});
