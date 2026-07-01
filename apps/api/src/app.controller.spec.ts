import { AppController } from './app.controller';

describe('AppController', () => {
  it('should return health status', () => {
    const controller = new AppController();
    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
