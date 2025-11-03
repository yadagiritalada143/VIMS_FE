import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VmsTabComponent } from './vms-tab.component';

describe('VmsTabComponent', () => {
  let component: VmsTabComponent;
  let fixture: ComponentFixture<VmsTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VmsTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VmsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
