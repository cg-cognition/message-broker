import { describe, it, expect, beforeEach } from 'vitest';
import { IRSVPConfig, RSVPResponse } from '../../main/contracts/contracts';
import { RSVPMediator } from '../../main/core/rsvp-mediator';
import * as uuid from 'uuid';
import { replaceProperties } from '../utils/test-utils';

describe('RSVPMediator', () => {
    beforeEach(() => {
        replaceProperties([
            {
                package: uuid,
                mocks: { v4: () => 'mockedId' },
            },
        ]);
    });

    function getInstance<T = any>(): RSVPMediator<T> {
        return new RSVPMediator<T>();
    }

    interface MockConfig extends IRSVPConfig {
        rsvp: {
            rsvpChannel: {
                payload: { data: string };
                response: string;
            };
            noMatchChannel: {
                payload: { data: string };
                response: string;
            };
        };
    }

    it('should create instance', () => {
        const instance = getInstance();
        expect(instance).toBeDefined();
    });

    it('should return empty array when invoking rsvp (publish) with no responders', () => {
        const instance = getInstance<MockConfig>();

        const results = instance.rsvp('rsvpChannel', { data: 'bar' });

        expect(results).toBeDefined();
        expect((results as Array<RSVPResponse<MockConfig>>).length).toBe(0);
    });

    it('should invoke the responders handler when rsvp (publish) invoked', () => {
        const instance = getInstance<MockConfig>();
        let invoked = false;
        instance.rsvp('rsvpChannel', () => {
            invoked = true;
            return 'Response 1';
        });

        instance.rsvp('rsvpChannel', { data: 'bar' });

        expect(invoked).toBeTruthy();
    });

    it('should return the responders response when rsvp (publish) invoked', () => {
        const instance = getInstance<MockConfig>();
        instance.rsvp('rsvpChannel', () => {
            return 'Response 1';
        });

        const results = instance.rsvp('rsvpChannel', { data: 'bar' });

        expect(Array.isArray(results)).toBe(true);
        if (Array.isArray(results)) {
            expect(results.length).toBe(1);
            expect(results[0]).toBe('Response 1');
        }
    });

    it('should NOT return the responders response when channel names do not match', () => {
        const instance = getInstance<MockConfig>();
        let invoked = false;
        instance.rsvp('noMatchChannel', () => {
            return 'Response 1';
            invoked = true;
        });

        const results = instance.rsvp('rsvpChannel', { data: 'bar' });

        expect(Array.isArray(results)).toBe(true);
        if (Array.isArray(results)) {
            expect(results.length).toBe(0);
            expect(invoked).toBeFalsy();
        }
    });

    it('should return a responder ref when rsvp (subscribe) invoked', () => {
        const instance = getInstance<MockConfig>();

        const responder = instance.rsvp('rsvpChannel', () => {
            return 'Response 1';
        });

        expect(Array.isArray(responder)).toBe(false);
        if (!Array.isArray(responder)) {
            expect(responder).toBeDefined();
            expect(responder.id).toBeDefined();
            expect(responder.disconnect).toBeDefined();
        }
    });

    it('should not invoke the responder handler if the responder has called disconnect', () => {
        const instance = getInstance<MockConfig>();

        const responder = instance.rsvp('rsvpChannel', () => {
            return 'Response 1';
        });

        expect(Array.isArray(responder)).toBe(false);
        if (!Array.isArray(responder)) {
            responder.disconnect();
        }

        const results = instance.rsvp('rsvpChannel', { data: 'bar' });
        if (Array.isArray(results)) {
            expect(results).toBeDefined();
            expect(results.length).toBe(0);
        }
    });

    it('should not throw error when disconnecting multiple times', () => {
        const instance = getInstance<MockConfig>();

        const responder1 = instance.rsvp('rsvpChannel', () => {
            return 'Response 1';
        });

        instance.rsvp('rsvpChannel', { data: 'bar' });

        expect(Array.isArray(responder1)).toBe(false);
        if (!Array.isArray(responder1)) {
            responder1.disconnect();
            expect(() => responder1.disconnect()).not.toThrowError();
        }
    });

    describe('Non matching', () => {
        let id = 0;
        beforeEach(() => {
            id = 0;
            replaceProperties([
                {
                    package: uuid,
                    mocks: {
                        v4: () => {
                            id++;
                            return id;
                        },
                    },
                },
            ]);
        });

        it('should not disconnect responders when disconnecting', () => {
            const instance = getInstance<MockConfig>();
            let responder2Count = 0;

            const responder1 = instance.rsvp('rsvpChannel', () => {
                return 'Response 1';
            });

            instance.rsvp('rsvpChannel', () => {
                responder2Count++;
                return 'Response 2';
            });

            instance.rsvp('rsvpChannel', { data: 'bar' });

            expect(Array.isArray(responder1)).toBe(false);
            if (!Array.isArray(responder1)) {
                responder1.disconnect();
            }

            instance.rsvp('rsvpChannel', { data: 'bar' });

            expect(responder2Count).toEqual(2);
        });
    });
});
