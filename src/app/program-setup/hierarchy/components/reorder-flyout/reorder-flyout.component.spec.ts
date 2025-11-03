import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ReorderFlyoutComponent } from './reorder-flyout.component';

describe('ReorderFlyoutComponent', () => {
  let component: ReorderFlyoutComponent;
  let fixture: ComponentFixture<ReorderFlyoutComponent>;
  CommonTestingModule.setUpTestBed(ReorderFlyoutComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReorderFlyoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReorderFlyoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
