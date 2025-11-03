import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NavTabsHandlerComponent } from './nav-tabs-handler.component';

describe('NavTabsHandlerComponent', () => {
  let component: NavTabsHandlerComponent;
  let fixture: ComponentFixture<NavTabsHandlerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NavTabsHandlerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavTabsHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
