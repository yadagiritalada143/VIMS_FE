import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VmsTabGroupComponent } from './vms-tab-group.component';

describe('VmsTabGroupComponent', () => {
  let component: VmsTabGroupComponent;
  let fixture: ComponentFixture<VmsTabGroupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VmsTabGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VmsTabGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
