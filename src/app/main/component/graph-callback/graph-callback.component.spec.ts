import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { GraphCallbackComponent } from './graph-callback.component';

describe('GraphCallbackComponent', () => {
  let component: GraphCallbackComponent;
  let fixture: ComponentFixture<GraphCallbackComponent>;
  CommonTestingModule.setUpTestBed(GraphCallbackComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphCallbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
